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
  month_code = month.strftime("%Y%m")

  beginning = month.beginning_of_month
  num_days_in_month = month.end_of_month.day
  num_days_in_month.times do |i|
    unless Price.where(date: month).exists?
      day = beginning + i
      day_code = day.strftime("%Y%m%d")
      puts "Fetching prices for #{day_code}..."
      Price.fetch_day day_code
    end
  end

  unless GenerationAmount.where(date: month).exists?
    puts "Fetching generation data for #{month_code}..."
    GenerationAmount.fetch_month month_code
  end
end

puts "Done!"
