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

  # Fetch a month's worth of prices from the EMI website (e.g. 201602)
  def self.fetch_month(month_code)
    url = "http://www.emi.ea.govt.nz/Datasets/download?directory=%2FDatasets%2FWholesale%2FFinal_pricing%2FFinal_prices%2F#{month_code}_Final_prices.csv"
    response = HTTParty.get url

    i = 0
    batch = []
    batch_size = 1000

    nodes = Node.all.map{ |n| { n.code => n.id }}.reduce(:merge) || {}

    Price.transaction do
      CSV.parse(response.body, headers: true) do |line|
        i += 1
        puts i if i % 1000 == 0
        node_id = nodes[line["Node"]]
        if !node_id
          puts "Node #{line["Node"]} not found, creating..."
          node_id = Node.create!(code: line["Node"]).id
          nodes[line["Node"]] = node_id
        end
        batch << Price.new(node_id: node_id, date: Date.parse(line["Trading_date"]), period: line["Trading_period"], price: line["Price"])
        if batch.size % batch_size == 0
          Price.import batch
          batch = []
        end
      end

      Price.import batch
    end
  end

end
