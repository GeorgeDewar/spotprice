# == Schema Information
#
# Table name: prices
#
#  id      :integer          not null, primary key
#  node_id :integer          not null
#  date    :date             not null
#  period  :integer          not null
#  price   :decimal(, )      not null
#

class Price < ActiveRecord::Base
  belongs_to :node

  # Fetch a month's worth of prices from the EMI website (e.g. 202208)
  def self.fetch_month(month_code)
    url = "https://www.emi.ea.govt.nz/Wholesale/Datasets/DispatchAndPricing/FinalEnergyPrices/ByMonth/#{month_code}_FinalEnergyPrices.csv"
    response = HTTParty.get url
    if response.code != 200
      puts "Error #{response.code} from server while fetching prices for #{month_code} from #{url}"
      return
    end

    process_data(response.body)
  end

  # Fetch a day's worth of prices from the EMI website (e.g. 20220823)
  def self.fetch_day(day_code)
    url = "https://www.emi.ea.govt.nz/Wholesale/Datasets/DispatchAndPricing/FinalEnergyPrices/#{day_code}_FinalEnergyPrices.csv"
    response = HTTParty.get url
    if response.code != 200
      puts "Error #{response.code} from server while fetching prices for #{day_code} from #{url}"
      return
    end

    process_data(response.body)
  end


  def self.process_data(csv_body)
    i = 0
    batch = []
    batch_size = 1000

    nodes = Node.all.map{ |n| { n.code => n.id }}.reduce(:merge) || {}

    Price.transaction do
      CSV.parse(csv_body, headers: true) do |line|
        i += 1
        puts i if i % 1000 == 0
        node_id = nodes[line["PointOfConnection"]]
        if !node_id
          puts "Node #{line["PointOfConnection"]} not found, creating..."
          node_id = Node.create!(code: line["PointOfConnection"]).id
          nodes[line["PointOfConnection"]] = node_id
        end
        batch << Price.new(node_id: node_id, date: Date.parse(line["TradingDate"]), period: line["TradingPeriod"], price: line["DollarsPerMegawattHour"])
        if batch.size % batch_size == 0
          Price.import batch
          batch = []
        end
      end

      Price.import batch
    end
  end

end
