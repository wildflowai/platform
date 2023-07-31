select 
  gbif_id,
  ifnull(verbatim_scientific_name, scientific_name) as verbatim_scientific_name,
  records_count
from metadata.species
order by 3 desc;
