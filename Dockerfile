FROM ruby:3.3.5

RUN mkdir -p /usr/src/app
WORKDIR /usr/src/app

RUN apt-get update # 2016-02-15
RUN apt-get -y install nodejs

COPY Gemfile /usr/src/app/
COPY Gemfile.lock /usr/src/app/
RUN bundle install --without development test

COPY . /usr/src/app

ENV RAILS_ENV=production
RUN SECRET_KEY_BASE=dummy rake assets:precompile

CMD rails s
