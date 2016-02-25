#!/bin/bash

month=$1

curl "http://www.emi.ea.govt.nz/Datasets/download?directory=%2FDatasets%2FWholesale%2FMetered_data%2FGrid_import%2F${month}_Grid_import.csv" > "tmp/prices_${month}.csv"
