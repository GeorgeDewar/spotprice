#!/bin/bash

month=$1

curl "http://www.emi.ea.govt.nz/Datasets/download?directory=%2FDatasets%2FWholesale%2FGeneration%2FGeneration_MD%2F${month}_Generation_MD.csv" > "tmp/generation_${month}.csv"
