package de.tum.aet.devops25.teamspoved;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.context.annotation.Bean;
import org.springframework.web.servlet.config.annotation.CorsRegistry;
import org.springframework.web.servlet.config.annotation.WebMvcConfigurer;

@SpringBootApplication
public class TicketingServiceApplication {

	public static void main(String[] args) {
		SpringApplication.run(TicketingServiceApplication.class, args);
	}

	@Bean
	public WebMvcConfigurer corsConfigurer() {
		return new WebMvcConfigurer() {
			@Override
			public void addCorsMappings(CorsRegistry registry) {
				registry.addMapping("/**")
						.allowedOrigins(
							// Local development
							"http://localhost:5173", "http://localhost:3000", "http://localhost:8000", 
							"http://localhost:8090", "http://localhost:8082", "http://localhost:8083", "http://localhost:8081",
							// K8s cluster domains
							"https://team-spoved.devops25.student.k8s.aet.cit.tum.de",
							"http://team-spoved.devops25.student.k8s.aet.cit.tum.de",
							"https://team-spoved.student.k8s.aet.cit.tum.de",
							"http://team-spoved.student.k8s.aet.cit.tum.de",
							// Internal service communication
							"http://client-service:3000", "http://client-service", 
							"http://ticket-service:8081", "http://user-service:8082", 
							"http://media-service:8083", "http://auth-service:8030"
						)
						.allowedMethods("GET", "POST", "PUT", "DELETE", "OPTIONS")
						.allowedHeaders("*")
						.allowCredentials(true);
			}
		};
	}

}
