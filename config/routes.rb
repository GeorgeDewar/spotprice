Rails.application.routes.draw do
  root "discovery#index"
  get "/data" => "discovery#data"
  get "/about" => "discovery#about"
end
