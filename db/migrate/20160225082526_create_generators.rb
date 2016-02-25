class CreateGenerators < ActiveRecord::Migration
  def change
    create_table :generators do |t|
      t.string :code, null: false
      t.string :name
      t.string :fuel, null: false
      t.string :technology, null: false
    end
  end
end
