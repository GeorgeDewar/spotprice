require_relative '../config/environment.rb'
require 'csv'

i = 0
batch = []
batch_size = 1000

nodes = Node.all.map{ |n| { n.code => n.id }}.reduce(:merge)

Price.transaction do
  CSV.foreach(ARGV[0], headers: true) do |line|
    i += 1
    puts i if i % 100 == 0
    node_id = nodes[line["Node"]]
    if !node_id
      puts "Node #{line["Node"]} not found, creating..."
      node_id = Node.create!(code: line["Node"]).id
    end
    batch << Price.new(node_id: node_id, date: Date.parse(line["Trading_date"]), period: line["Trading_period"], price: line["Price"])
    if batch.size % batch_size == 0
      Price.import batch
      batch = []
    end
  end

  Price.import batch
end
