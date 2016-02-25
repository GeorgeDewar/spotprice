class Generator < ActiveRecord::Base
  belongs_to :node
  has_many :generation_amounts
end