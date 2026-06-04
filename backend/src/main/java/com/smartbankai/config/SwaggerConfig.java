package com.smartbankai.config;

import io.swagger.v3.oas.models.OpenAPI;
import io.swagger.v3.oas.models.info.Info;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

@Configuration
public class SwaggerConfig {
    @Bean
    OpenAPI smartBankOpenApi() {
        return new OpenAPI().info(new Info().title("SmartBank AI APIs").version("1.0.0").description("Monolithic AI-powered digital banking ecosystem"));
    }
}
