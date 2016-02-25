class CreateGenerationAmounts < ActiveRecord::Migration
  def change
    create_table :generation_amounts do |t|
      t.references :generator, null: false
      t.date :date, null: false
      t.integer :period, null: false
      t.decimal :quantity, null: false
    end

    add_index :generation_amounts, [:generator_id, :date, :period], unique: true
  end
end
