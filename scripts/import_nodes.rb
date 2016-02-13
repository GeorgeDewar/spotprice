require_relative '../config/environment.rb'
require 'csv'

CSV.foreach(ARGV[0], headers: true) do |line|
  Node.find_or_initialize_by(code: line["GXP/GIP"]).update_attributes!(
    name: line["Name"],
    location: [line["Lat"].to_f, line["Long"].to_f]
  )
end
