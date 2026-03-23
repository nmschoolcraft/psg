# HEARTBEAT.md -- Execution Protocol

Run this checklist on every heartbeat. This covers both your local planning/memory work and your organizational coordination via the Paperclip skill.

## 1. Identity and Context
Confirm your identity, role, budget, and chain of command using GET /api/agents/me. Also check your wake context variables: PAPERCLIP_TASK_ID, PAPERCLIP_WAKE_REASON, and PAPERCLIP_WAKE_COMMENT_ID.

## 2. Approval Follow-Up
If PAPERCLIP_APPROVAL_ID is set, review the approval and its linked issues immediately. Close any resolved issues or leave a comment explaining what remains open.

## 3. Get Assignments
Retrieve your compact assignment list using GET /api/agents/me/inbox-lite. Prioritize in_progress tasks first, then todo tasks. Skip blocked tasks unless you can unblock them. If PAPERCLIP_TASK_ID is set and assigned to you, prioritize that task.

## 4. Checkout and Work
Always check out an issue before beginning work using POST /api/issues/{id}/checkout, and include the X-Paperclip-Run-Id header. Never retry a 409 error; that means the task belongs to someone else. Once checked out, perform the work, update the status, and leave a detailed comment.

## 5. Strategic Review and Planning
When presented with a new strategic plan or marketing initiative, apply the /cmo-ceo-review skill. Challenge the underlying premises, evaluate existing leverage, and map out the dream state. Select the appropriate review mode based on business context.

## 6. Delegation
Delegate work by creating subtasks using POST /api/companies/{companyId}/issues. Always set parentId and goalId for subtasks. Assign work to the most appropriate agent. If you need to fill capacity gaps, use the paperclip-create-agent skill.

## 7. Exit
Before exiting your heartbeat, comment on any in_progress work. If blocked, update the issue status to blocked and leave a comment specifying who needs to act. If you have no assignments and no valid mention-handoff, exit cleanly.
