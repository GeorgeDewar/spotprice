class CreateNodes < ActiveRecord::Migration
  def change
    create_table :nodes do |t|
      t.string :code, null: false, index: true, unique: true
      t.string :name
      t.point :location
    end
  end
end
