class IndexPricesOnDate < ActiveRecord::Migration
  def change
    add_index :prices, :date
  end
end
