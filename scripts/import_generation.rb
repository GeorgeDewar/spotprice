require_relative '../config/environment.rb'
require 'csv'

i = 0
batch = []
batch_size = 1000

nodes = Node.all.map{ |n| { n.code => n.id }}.reduce(:merge) || {}
generators = Generator.all.map{ |n| { n.code => n.id }}.reduce(:merge) || {}

GenerationAmount.transaction do
  CSV.foreach(ARGV[0], headers: true) do |line|
    i += 1
    puts i if i % 1000 == 0

    node_id = nodes[line["POC_Code"]]
    if !node_id
      puts "Node #{line["POC_Code"]} not found, creating..."
      node_id = Node.create!(code: line["POC_Code"]).id
      nodes[line["POC_Code"]] = node_id
    end

    generator_id = generators[line["Gen_Code"]]
    if !generator_id
      puts "Generator #{line["Gen_Code"]} not found, creating..."
      generator_id = Generator.create!(code: line["Gen_Code"], fuel: line["Fuel_Code"], technology: line['Tech_Code']).id
      generators[line["Gen_Code"]] = generator_id
    end

    (1..48).each do |j|
      begin
        if line["TP#{j}"].strip.blank?
          puts "No data for line #{i}, period #{j}"
        else
          batch << GenerationAmount.new(generator_id: generator_id, node_id: node_id, network_code: line["Nwk_Code"],
            date: Date.parse(line["Trading_date"]), period: j, quantity: line["TP#{j}"])
        end
      rescue => e
        puts "Error occurred on line #{i}, period #{j}"
        raise e
      end
      if batch.size % batch_size == 0
        GenerationAmount.import batch
        batch = []
      end
    end
  end

  GenerationAmount.import batch
end
