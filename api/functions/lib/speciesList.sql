select 
  gbif_id,
  scientific_name,
  records_count
from metadata.species
order by 3 desc;
