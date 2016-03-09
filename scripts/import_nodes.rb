require_relative '../config/environment.rb'
require 'csv'
require 'proj4'

def nztm_to_wgs84(easting, northing)
  src_point = Proj4::Point.new(easting, northing)

  src_proj = Proj4::Projection.new('+proj=tmerc +lat_0=0 +lon_0=173 +k=0.9996 +x_0=1600000 +y_0=10000000 +ellps=GRS80 +towgs84=0,0,0,0,0,0,0 +units=m +no_defs')
  dst_proj = Proj4::Projection.new('+proj=longlat +ellps=WGS84 +datum=WGS84 +no_defs')

  dst_point = src_proj.transform(dst_proj, src_point)

  [dst_point.lat * (180 / Math::PI), dst_point.lon * (180 / Math::PI)]
end

response = HTTParty.get("http://www.emi.ea.govt.nz/Reports/DownloadDataReport?reportName=R_NSPL_DR")
raise "Error: #{response.message}" unless response.code == 200

content = response.body.lines.drop(5).join

CSV.parse(content, headers: true) do |line|
  next if line["Current flag"] != "1" || !line["Embedded under POC code"].try(:strip).blank?

  Node.find_or_initialize_by(code: line["POC code"]).update_attributes!(
      name: line["Description"].titleize,
      location: nztm_to_wgs84(line["NZTM easting"].to_f, line["NZTM northing"].to_f)
  )
end
