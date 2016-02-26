# == Schema Information
#
# Table name: generators
#
#  id         :integer          not null, primary key
#  code       :string           not null
#  name       :string
#  fuel       :string           not null
#  technology :string           not null
#

class Generator < ActiveRecord::Base
  belongs_to :node
  has_many :generation_amounts
end
