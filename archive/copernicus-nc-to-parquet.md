python scripts to delete:

```py
import numpy as np
import os
import pandas as pd
from google.cloud import storage
from netCDF4 import Dataset
import tempfile
from google.cloud import bigquery
import cftime

def convert_time_to_datetime(time_values, units, calendar="gregorian"):
    cftime_dates = cftime.num2date(time_values, units=units, calendar=calendar)
    return np.array([pd.Timestamp(str(date)) for date in cftime_dates])

def extract_data_from_nc(file, var_name):
    print('opening> ', file, var_name)
    with Dataset(file, 'r') as nc:
        print('variables>>>', nc.variables.keys())
        # Extract data from the NetCDF4 file
        # time_units = nc.variables['time'].units
        # time_calendar = nc.variables['time'].calendar
        time_values = nc.variables['time'][:]
        # time = convert_time_to_datetime(time_values, time_units, time_calendar)
        time = time_values
        latitude = nc.variables['lat'][:]
        longitude = nc.variables['lon'][:]

        # Check for the presence of 'depth' variable
        if 'depth' in nc.variables:
            depth = nc.variables['depth'][:]
        else:
            depth = np.array([0])

        if var_name == 'chl':
            var_name = 'CHL'
        var_val = nc.variables[var_name][:]

    return time, latitude, longitude, depth, var_val


# def extract_data_from_nc(file, var_name):
#     print('opening> ', file, var_name)
#     with Dataset(file, 'r') as nc:
#         print('variables>>>', nc.variables.keys())
#         # Extract data from the NetCDF4 file
#         # time_units = nc.variables['time'].units
#         # time_calendar = nc.variables['time'].calendar
#         time_values = nc.variables['time'][:]
#         # time = convert_time_to_datetime(time_values, time_units, time_calendar)
#         time = time_values
#         latitude = nc.variables['latitude'][:]
#         longitude = nc.variables['longitude'][:]

#         # Check for the presence of 'depth' variable
#         if 'depth' in nc.variables:
#             depth = nc.variables['depth'][:]
#         else:
#             depth = np.array([0])

#         if var_name == 'chl':
#             var_name = 'CHL'
#         var_val = nc.variables[var_name][:]

#     return time, latitude, longitude, depth, var_val

def convert_to_dataframe(time, latitude, longitude, depth, var_name, var_val):
    # Using numpy's broadcasting to generate the data
    t, d, lat, lon = np.meshgrid(time, depth, latitude, longitude, indexing="ij")
    data = {
        'time': t.ravel(),
        'depth': d.ravel(),
        'latitude': lat.ravel(),
        'longitude': lon.ravel(),
        var_name: var_val.ravel()
    }

    df = pd.DataFrame(data)
    return df


def save_dataframe_to_parquet(df, filename):
    df.to_parquet(filename, index=False)
    print(f"Data saved to {filename}")
    return filename

def process_file(input_filename, output_filename, var_name):
    print(input_filename, '] starting...')
    time, latitude, longitude, depth, var_val = extract_data_from_nc(input_filename, var_name)
    print(input_filename, '] extracted')
    df = convert_to_dataframe(time, latitude, longitude, depth, var_name, var_val)
    print(input_filename, '] converted')
    # df = generate_mock_data()
    # print('>>', df)
    # upload_to_bigquery_using_client(df, project_id, dataset_id, table_id)
    # print('uploaded')
    save_dataframe_to_parquet(df, output_filename)
    print(input_filename, '] processed!')

# process_file(
#     'copernicus/global_multiyear_vo_2015_2020.nc',
#     'parquet/global_multiyear_vo_2015_2020.parquet',
#     'vo',
# )
```

and a bit more:

```py
files = {
    # 'chlorophyll_1997.nc': 'chl',
    # 'chlorophyll_1998_1999.nc': 'chl',
    # 'chlorophyll_2000_2001.nc': 'chl',
    # 'chlorophyll_2002_2003.nc': 'chl',
    'chlorophyll_2004_2005.nc': 'chl',
    # 'chlorophyll_2006_2007.nc': 'chl',
    # 'chlorophyll_2008_2009.nc': 'chl',
    # 'chlorophyll_2010_2011.nc': 'chl',
    # 'chlorophyll_2012_2013.nc': 'chl',
    # 'chlorophyll_2014_2015.nc': 'chl',
    # 'chlorophyll_2016_2017.nc': 'chl',
    # 'chlorophyll_2018_2019.nc': 'chl',
    # 'chlorophyll_2020_2021.nc': 'chl',
    # 'chlorophyll_2022.nc': 'chl',
    # 'chlorophyll_2023.nc': 'chl',
#     'global_multiyear_mlotst_1993_1997.nc': 'mlotst',
#     'global_multiyear_mlotst_1998_2004.nc': 'mlotst',
#     'global_multiyear_mlotst_2005_2009.nc': 'mlotst',
#     'global_multiyear_mlotst_2010_2014.nc': 'mlotst',
#     'global_multiyear_mlotst_2015_2020.nc': 'mlotst',
#     'global_multiyear_so_1993_1997.nc': 'so',
#     'global_multiyear_so_1998_2004.nc': 'so',
#     'global_multiyear_so_2005_2009.nc': 'so',
#     'global_multiyear_so_2010_2014.nc': 'so',
#     'global_multiyear_so_2015_2020.nc': 'so',
#     'global_multiyear_thetao_1993_1997.nc': 'thetao',
#     'global_multiyear_thetao_1998_2004.nc': 'thetao',
#     'global_multiyear_thetao_2005_2009.nc': 'thetao',
#     'global_multiyear_thetao_2010_2014.nc': 'thetao',
#     'global_multiyear_thetao_2015_2020.nc': 'thetao',
#     'global_multiyear_uo_1993_1997.nc': 'uo',
#     'global_multiyear_uo_1998_2004.nc': 'uo',
#     'global_multiyear_uo_2005_2009.nc': 'uo',
#     'global_multiyear_uo_2010_2014.nc': 'uo',
#     'global_multiyear_uo_2015_2020.nc': 'uo',
#     'global_multiyear_vo_1993_1997.nc': 'vo',
#     'global_multiyear_vo_1998_2004.nc': 'vo',
#     'global_multiyear_vo_2005_2009.nc': 'vo',
#     'global_multiyear_vo_2010_2014.nc': 'vo',
#     'global_multiyear_vo_2015_2020.nc': 'vo'
}

import os
import time

def seconds_to_hms(seconds):
    hours, remainder = divmod(seconds, 3600)
    minutes, seconds = divmod(remainder, 60)
    return f"{int(hours)} hours, {int(minutes)} minutes, {int(seconds)} seconds"


ts = time.time()
for input_filename, variable in files.items():
    output_filename = os.path.join('parquet', input_filename.replace('.nc', '.parquet'))
    input_filename = os.path.join('copernicus', input_filename)
    print('')
    print(input_filename, output_filename)

    # Check if the output file already exists
    if os.path.exists(output_filename):
        print(f"Output file {output_filename} already exists. Skipping...")
        continue

    process_file(input_filename,output_filename, variable)
    print('tm: ', seconds_to_hms(time.time() - ts))
```
