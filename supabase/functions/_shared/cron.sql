-- Enable the pg_cron extension
select cron.schedule(
    'portfolio-snapshots-6h', -- job name
    '0 */6 * * *', -- cron expression: every 6 hours at minute 0
    $$
    select
      net.http_post(
          url:='https://obetvwitblwconqnxlxi.supabase.co/functions/v1/create-all-snapshots',
          headers:='{"Content-Type": "application/json", "Authorization": "Bearer ' || current_setting('app.service_role_key') || '"}'::jsonb,
          body:='{}'::jsonb
      ) as request_id;
    $$
);