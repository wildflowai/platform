# this thing converts .nc to .parquet

import xarray as xr
import pyarrow as pa
import pandas as pd
import gc 
from tqdm import tqdm
import pyarrow.parquet as pq

def process_netcdf_chunks(filename, chunk_size=100):
    """Processes a NetCDF file in chunks, yielding Pandas DataFrames."""

    with xr.open_dataset(filename) as ds:
        for i in tqdm(range(0, len(ds['time']), chunk_size), desc="Creating DataFrames"):
            chunk = ds[['zooc', 'time', 'latitude', 'longitude']].isel(time=slice(i, i + chunk_size))
            yield chunk.to_dataframe().reset_index(drop=True) 

def create_parquet(filename):
    print('here 1')
    df_chunks = process_netcdf_chunks(filename) 
    print('here 2')

    # Get the structure from the first chunk
    first_chunk = next(df_chunks) 
    table = pa.Table.from_pandas(first_chunk)
    del first_chunk  # Release memory

    for chunk in tqdm(df_chunks, desc="Writing Parquet File"):
        table = pa.concat_tables([table, pa.Table.from_pandas(chunk)])
        del chunk  
        gc.collect()  

    print('here 3')
    pq.write_table(table, 'copernicus_zooplankton.parquet')
    print('here 4')

# Main execution
if __name__ == "__main__":
    create_parquet('copernicus_zooplankton.nc') 
