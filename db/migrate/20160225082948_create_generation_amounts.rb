class CreateGenerationAmounts < ActiveRecord::Migration
  def change
    create_table :generation_amounts do |t|
      t.references :generator, null: false
      t.references :node, null: false
      t.string :network_code, null: false
      t.date :date, null: false
      t.integer :period, null: false
      t.decimal :quantity, null: false
    end

    add_index :generation_amounts, [:generator_id, :node_id, :network_code, :date, :period], unique: true,
        name: "generation_amounts_unique"
  end
end
