Rails.application.routes.draw do
  root "discovery#index"
  get "/data" => "discovery#data"
  get "/generation" => "discovery#generation"
  get "/data/generation" => "discovery#generation_data"
  get "/about" => "discovery#about"
end
