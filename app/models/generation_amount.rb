# == Schema Information
#
# Table name: generation_amounts
#
#  id           :integer          not null, primary key
#  generator_id :integer          not null
#  node_id      :integer          not null
#  network_code :string           not null
#  date         :date             not null
#  period       :integer          not null
#  quantity     :decimal(, )      not null
#

class GenerationAmount < ActiveRecord::Base
  belongs_to :generator
end
