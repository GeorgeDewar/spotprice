# == Schema Information
#
# Table name: prices
#
#  id      :integer          not null, primary key
#  node_id :integer          not null
#  date    :date             not null
#  period  :integer          not null
#  price   :decimal(, )      not null
#

class Price < ActiveRecord::Base
  belongs_to :node
end
