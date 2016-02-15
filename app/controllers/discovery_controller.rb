require "csv"

class DiscoveryController < ApplicationController

  def index
    redirect_to root_path(node: "CPK0331") unless params[:node]

    @nodes = Node.all
    @node = Node.find_by_code(params[:node])

    @from = Price.maximum(:date) - 12.months + 1.day
    @to = Price.maximum(:date)
  end

  def data
    node = Node.find_by_code!(params[:node])
    max_date = Price.maximum(:date)
    csv = Rails.cache.fetch("prices/#{node.code}/#{max_date}/csv") do
      prices = ActiveRecord::Base.connection.select_all <<-SQL
      select date, period, price from prices where node_id = #{node.id} and date >= '#{max_date - 12.months + 1.day}'
      SQL
      CSV.generate(encoding: "UTF-8") do |csv|
        csv << prices.first.keys
        prices.each do |x|
          csv << x.values
        end
      end
    end
    render body: csv
  end

  def about
  end

end
