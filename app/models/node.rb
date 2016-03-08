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

  def voltage
    code[3..5].to_i
  end

  def description
    "#{name || "Unknown"} (#{code}, #{voltage}kv)"
  end
end
