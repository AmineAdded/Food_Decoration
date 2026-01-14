package com.eleonetech.app.config;

import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.core.convert.converter.Converter;
import org.springframework.data.mongodb.MongoDatabaseFactory;
import org.springframework.data.mongodb.core.MongoTemplate;
import org.springframework.data.mongodb.core.convert.DefaultDbRefResolver;
import org.springframework.data.mongodb.core.convert.DefaultMongoTypeMapper;
import org.springframework.data.mongodb.core.convert.MappingMongoConverter;
import org.springframework.data.mongodb.core.convert.MongoCustomConversions;
import org.springframework.data.mongodb.core.mapping.MongoMappingContext;
import org.springframework.data.mongodb.repository.config.EnableMongoRepositories;

import java.time.LocalDateTime;
import java.time.ZoneId;
import java.util.ArrayList;
import java.util.Date;
import java.util.List;

@Configuration
@EnableMongoRepositories(basePackages = "com.eleonetech.app.repository")
public class MongoConfig {

    @Bean
    public MongoTemplate mongoTemplate(MongoDatabaseFactory mongoDbFactory,
                                       MongoMappingContext context) {
        MappingMongoConverter converter =
                new MappingMongoConverter(new DefaultDbRefResolver(mongoDbFactory), context);

        // Ajouter les convertisseurs personnalisés
        converter.setCustomConversions(mongoCustomConversions());
        converter.afterPropertiesSet();

        // Enlever le champ "_class" qui est ajouté par défaut
        converter.setTypeMapper(new DefaultMongoTypeMapper(null));

        return new MongoTemplate(mongoDbFactory, converter);
    }

    @Bean
    public MongoCustomConversions mongoCustomConversions() {
        List<Converter<?, ?>> converters = new ArrayList<>();

        // Convertisseur de LocalDateTime vers Date (pour MongoDB)
        converters.add(new Converter<LocalDateTime, Date>() {
            @Override
            public Date convert(LocalDateTime source) {
                return Date.from(source.atZone(ZoneId.systemDefault()).toInstant());
            }
        });

        // Convertisseur de Date vers LocalDateTime (depuis MongoDB)
        converters.add(new Converter<Date, LocalDateTime>() {
            @Override
            public LocalDateTime convert(Date source) {
                return source.toInstant().atZone(ZoneId.systemDefault()).toLocalDateTime();
            }
        });

        return new MongoCustomConversions(converters);
    }
}