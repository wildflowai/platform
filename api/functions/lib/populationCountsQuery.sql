SELECT
  organism.gbif_id,
  TIMESTAMP_TRUNC(timestamp, WEEK(MONDAY)) AS day_start,
  location.lat,
  location.lon,
  AVG(metadata.individualCount) AS mean_count
FROM `wildflow-demo.clean.*`
WHERE timestamp IS NOT NULL
  AND metadata.individualCount IS NOT NULL
  AND organism.gbif_id IN (__GBIF_IDS__)
GROUP BY 1, 2, 3, 4
ORDER BY 1, 2, 3, 4
