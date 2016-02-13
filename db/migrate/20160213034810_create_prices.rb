class CreatePrices < ActiveRecord::Migration
  def change
    create_table :prices do |t|
      t.references :node, null: false
      t.date :date, null: false
      t.integer :period, null: false
      t.decimal :price, null: false
    end

    add_index :prices, [:node_id, :date, :period], unique: true
  end
end
