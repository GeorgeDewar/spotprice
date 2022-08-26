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

  # Fetch a day's worth of prices from the EMI website (e.g. 20220823)
  def self.fetch_day(date)
    url = "https://www.emi.ea.govt.nz/Wholesale/Datasets/FinalPricing/EnergyPrices/#{date}_FinalEnergyPrices.csv"
    response = HTTParty.get url
    if response.code != 200
      puts "Error #{response.code} from server while fetching prices for #{date} from #{url}"
      return
    end

    i = 0
    batch = []
    batch_size = 1000

    nodes = Node.all.map{ |n| { n.code => n.id }}.reduce(:merge) || {}

    Price.transaction do
      CSV.parse(response.body, headers: true) do |line|
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
