# encoding: UTF-8
# This file is auto-generated from the current state of the database. Instead
# of editing this file, please use the migrations feature of Active Record to
# incrementally modify your database, and then regenerate this schema definition.
#
# Note that this schema.rb definition is the authoritative source for your
# database schema. If you need to create the application database on another
# system, you should be using db:schema:load, not running all the migrations
# from scratch. The latter is a flawed and unsustainable approach (the more migrations
# you'll amass, the slower it'll run and the greater likelihood for issues).
#
# It's strongly recommended that you check this file into your version control system.

ActiveRecord::Schema.define(version: 20160225082948) do

  # These are extensions that must be enabled in order to support this database
  enable_extension "plpgsql"

  create_table "generation_amounts", force: :cascade do |t|
    t.integer "generator_id", null: false
    t.date    "date",         null: false
    t.integer "period",       null: false
    t.decimal "quantity",     null: false
  end

  add_index "generation_amounts", ["generator_id", "date", "period"], name: "index_generation_amounts_on_generator_id_and_date_and_period", unique: true, using: :btree

  create_table "generators", force: :cascade do |t|
    t.string  "code",       null: false
    t.string  "name"
    t.integer "node_id",    null: false
    t.string  "fuel",       null: false
    t.string  "technology", null: false
  end

  create_table "nodes", force: :cascade do |t|
    t.string "code",     null: false
    t.string "name"
    t.point  "location"
  end

  add_index "nodes", ["code"], name: "index_nodes_on_code", using: :btree

  create_table "prices", force: :cascade do |t|
    t.integer "node_id", null: false
    t.date    "date",    null: false
    t.integer "period",  null: false
    t.decimal "price",   null: false
  end

  add_index "prices", ["date"], name: "index_prices_on_date", using: :btree
  add_index "prices", ["node_id", "date", "period"], name: "index_prices_on_node_id_and_date_and_period", unique: true, using: :btree

end
