require "csv"

class DiscoveryController < ApplicationController

  def index
    node = Node.find_by_code("TKR0331")
  end

  def data
    node = Node.find_by_code("TKR0331")
    prices = ActiveRecord::Base.connection.select_all <<-SQL
    select date, period, price from prices where node_id = #{node.id}
    SQL
    render body: (CSV.generate(encoding: "UTF-8") do |csv|
      csv << prices.first.keys
      prices.each do |x|
        csv << x.values
      end
    end)
  end

end
