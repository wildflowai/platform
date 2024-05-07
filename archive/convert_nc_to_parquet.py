# this thing converts .nc to .parquet

import xarray as xr
import pyarrow as pa
import pandas as pd
import gc
from tqdm import tqdm
import pyarrow.parquet as pq

def process_netcdf_chunks(filename, chunk_size=500):
    with xr.open_dataset(filename) as ds:
        for i in tqdm(range(0, len(ds['time']), chunk_size), desc="Creating DataFrames"):
            chunk = ds[['zooc', 'time', 'latitude', 'longitude']].isel(time=slice(i, i + chunk_size))
            df = chunk.to_dataframe().reset_index() 
            yield df

def create_parquet(filename):
    print('here 1')
    df_chunks = process_netcdf_chunks(filename)
    print('here 2')

    base_filename = 'pq/copernicus_zooplankton_chunk'  # Filename for intermediate chunks
    chunk_counter = 0

    for chunk in tqdm(df_chunks, desc="Writing Parquet File"):
        pq.write_table(pa.Table.from_pandas(chunk), f'{base_filename}_{chunk_counter}.parquet')
        chunk_counter += 1  

    print('here 3')

# Main execution
if __name__ == "__main__":
    create_parquet('copernicus_zooplankton.nc')
