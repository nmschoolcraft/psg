-- BigQuery Dataset Setup for PSG Benchmarks
-- Run this once per GCP project to initialize the benchmarks database.
-- Project: set via bq --project_id or in the console.

CREATE SCHEMA IF NOT EXISTS `psg_benchmarks`
  OPTIONS (
    description = 'PSG Advantage Platform — anonymized shop performance and industry benchmarks',
    location = 'US'
  );
