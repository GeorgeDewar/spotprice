# Fetch nodes if required
# Fetch updated prices
# Fetch updated generation data

require_relative '../config/environment.rb'
require 'csv'

# Go back 13 months to give a bit of room to ensure we do have 12 full months of data. It will try to fetch last month
# at the beginning of next month, allowing a whole month for it to be uploaded.

first_month = Date.today - 13.months
months = 12.times.map { |x| (first_month + x.months) }

months.each do |month|
  code = month.strftime("%Y%m")

  unless Price.where(date: month).exists?
    puts "Fetching prices for #{code}..."
    Price.fetch_month code
  end

  unless GenerationAmount.where(date: month).exists?
    puts "Fetching generation data for #{code}..."
    GenerationAmount.fetch_month code
  end
end

puts "Done!"
