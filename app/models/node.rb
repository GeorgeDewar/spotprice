# == Schema Information
#
# Table name: nodes
#
#  id       :integer          not null, primary key
#  code     :string           not null
#  name     :string
#  location :point
#

class Node < ActiveRecord::Base
  has_many :prices
end
