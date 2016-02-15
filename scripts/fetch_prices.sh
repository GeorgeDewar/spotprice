#!/bin/bash

month=$1

curl "http://www.emi.ea.govt.nz/Datasets/download?directory=%2FDatasets%2FWholesale%2FFinal_pricing%2FFinal_prices%2F${month}_Final_prices.csv" > "data/prices_${month}.csv"
