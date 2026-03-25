import * as Sentry from '@sentry/node';
import { createClient } from '@supabase/supabase-js';
import express, { NextFunction, Request, Response } from 'express';
import multer from 'multer';
import { supabase } from '../supabase';
import { processRepairOrdersCsv } from './processor';

export const importRouter = express.Router();

// Accept CSV uploads in memory (max 10MB)
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 10 * 1024 * 1024 },
  fileFilter: (_req, file, cb) => {
    if (file.mimetype === 'text/csv' || file.originalname.endsWith('.csv')) {
      cb(null, true);
    } else {
      cb(new Error('Only CSV files are accepted'));
    }
  },
});

// ----------------------------------------------------------------
// Auth middleware: verifies the caller's Supabase JWT and extracts
// company_id. The import API uses its own JWT verification so that
// it can be deployed separately from edge functions.
// ----------------------------------------------------------------
async function requireAuth(req: Request, res: Response, next: NextFunction): Promise<void> {
  const authHeader = req.headers['authorization'];
  if (!authHeader?.startsWith('Bearer ')) {
    res.status(401).json({ error: 'Missing or invalid Authorization header' });
    return;
  }

  const token = authHeader.slice(7);
  const userClient = createClient(
    process.env.SUPABASE_URL!,
    process.env.SUPABASE_ANON_KEY!,
    { global: { headers: { Authorization: `Bearer ${token}` } } },
  );

  const { data: { user }, error } = await userClient.auth.getUser();
  if (error || !user) {
    res.status(401).json({ error: 'Invalid or expired token' });
    return;
  }

  // company_id is in custom JWT claims (injected by our hook)
  const companyId = (user.user_metadata?.company_id as string | undefined)
    ?? (user.app_metadata?.company_id as string | undefined);

  if (!companyId) {
    res.status(403).json({ error: 'No company associated with this account' });
    return;
  }

  (req as AuthedRequest).companyId = companyId;
  (req as AuthedRequest).userId    = user.id;
  next();
}

interface AuthedRequest extends Request {
  companyId: string;
  userId:    string;
}

// ----------------------------------------------------------------
// POST /api/import/repair-orders
// Body: multipart/form-data with file: <csv> and optional template: <name>
// ----------------------------------------------------------------
importRouter.post(
  '/repair-orders',
  requireAuth,
  upload.single('file'),
  async (req: Request, res: Response): Promise<void> => {
    const { companyId } = req as AuthedRequest;
    const templateName = typeof req.body?.template === 'string' ? req.body.template : undefined;

    if (!req.file) {
      res.status(400).json({ error: 'No file uploaded' });
      return;
    }

    // Create import log entry (pending)
    const { data: importLog, error: logError } = await supabase
      .from('import_logs')
      .insert({
        company_id: companyId,
        filename:   req.file.originalname,
        status:     'processing',
      })
      .select('id')
      .single();

    if (logError || !importLog) {
      res.status(500).json({ error: 'Failed to create import log' });
      return;
    }

    try {
      const result = await processRepairOrdersCsv(
        companyId,
        req.file.buffer,
        templateName,
      );

      // Update import log with results
      await supabase
        .from('import_logs')
        .update({
          row_count:     result.total,
          success_count: result.inserted,
          failure_count: result.skipped,
          status:        result.errors.length === result.total ? 'failed' : 'completed',
          errors:        result.errors,
        })
        .eq('id', importLog.id);

      // Report structured failures to Sentry if any
      if (result.errors.length > 0) {
        const { data: updatedLog } = await supabase
          .from('import_logs')
          .select('id, sentry_event_id')
          .eq('id', importLog.id)
          .single();

        if (!updatedLog?.sentry_event_id) {
          const sentryId = Sentry.captureMessage('CSV import completed with row errors', {
            level: 'warning',
            extra: {
              companyId,
              importLogId: importLog.id,
              filename: req.file?.originalname,
              total: result.total,
              failed: result.skipped,
              sampleErrors: result.errors.slice(0, 5),
            },
          });

          await supabase
            .from('import_logs')
            .update({ sentry_event_id: sentryId })
            .eq('id', importLog.id);
        }
      }

      res.status(200).json({
        import_log_id: importLog.id,
        total:         result.total,
        inserted:      result.inserted,
        skipped:       result.skipped,
        error_count:   result.errors.length,
        errors:        result.errors,
      });
    } catch (err) {
      Sentry.captureException(err, { extra: { companyId, importLogId: importLog.id } });

      await supabase
        .from('import_logs')
        .update({ status: 'failed' })
        .eq('id', importLog.id);

      res.status(500).json({ error: 'Import failed unexpectedly' });
    }
  },
);

// ----------------------------------------------------------------
// GET /api/import/templates
// Returns the company's saved field mapping template names
// ----------------------------------------------------------------
importRouter.get(
  '/templates',
  requireAuth,
  async (req: Request, res: Response): Promise<void> => {
    const { companyId } = req as AuthedRequest;

    const { data, error } = await supabase
      .from('companies')
      .select('field_mappings')
      .eq('id', companyId)
      .single();

    if (error) {
      res.status(500).json({ error: 'Failed to fetch templates' });
      return;
    }

    const templates = Object.keys((data?.field_mappings as Record<string, unknown>) ?? {});
    res.json({ templates });
  },
);

// ----------------------------------------------------------------
// PUT /api/import/templates/:name
// Saves a field mapping template for the company
// ----------------------------------------------------------------
importRouter.put(
  '/templates/:name',
  requireAuth,
  async (req: Request, res: Response): Promise<void> => {
    const { companyId } = req as AuthedRequest;
    const { name } = req.params;
    const mapping = req.body;

    if (!mapping || typeof mapping !== 'object') {
      res.status(400).json({ error: 'Template body must be a JSON mapping object' });
      return;
    }

    // Load existing field_mappings and merge
    const { data: company } = await supabase
      .from('companies')
      .select('field_mappings')
      .eq('id', companyId)
      .single();

    const existing = (company?.field_mappings as Record<string, unknown>) ?? {};
    const updated  = { ...existing, [name]: mapping };

    const { error } = await supabase
      .from('companies')
      .update({ field_mappings: updated })
      .eq('id', companyId);

    if (error) {
      res.status(500).json({ error: 'Failed to save template' });
      return;
    }

    res.json({ saved: name });
  },
);
