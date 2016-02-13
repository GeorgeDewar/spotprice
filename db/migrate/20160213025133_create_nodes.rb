class CreateNodes < ActiveRecord::Migration
  def change
    create_table :nodes do |t|
      t.string :code, null: false, index: true, unique: true
      t.string :name, null: false
      t.point :location, null: false
    end
  end
end
