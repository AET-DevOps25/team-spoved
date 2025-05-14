package de.tum.aet.devops25.teamspoved.service;

import de.tum.aet.devops25.teamspoved.model.Day;
import de.tum.aet.devops25.teamspoved.model.Dish;
import de.tum.aet.devops25.teamspoved.model.Week;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestTemplate;

import java.time.Clock;
import java.time.LocalDate;
import java.time.ZoneId;
import java.time.temporal.WeekFields;
import java.util.List;
import java.util.Locale;
import java.util.Optional;

@Service
public class CanteenService {

    private final RestTemplate restTemplate;
    private final Clock clock;

    private static final String BASE_URL = "https://tum-dev.github.io/eat-api/";

    public CanteenService(RestTemplate restTemplate, Clock clock) {
        this.restTemplate = restTemplate;
        this.clock = clock;
    }

    /**
     * Get today's meals for a specific canteen
     * @param canteenName the name of the canteen, e.g., "mensa-garching"
     * @return list of dishes available today, or empty list if no data found
     */
    public List<Dish> getTodayMeals(String canteenName) {
        LocalDate today = LocalDate.now(clock);
        int year = today.getYear();
        int weekNumber = today.get(WeekFields.of(Locale.getDefault()).weekOfWeekBasedYear());
        String weekStr = String.format("%02d", weekNumber);
        
        try {
            String url = BASE_URL + canteenName + "/" + year + "/" + weekStr + ".json";
            Week week = restTemplate.getForObject(url, Week.class);
            
            if (week != null && week.days() != null) {
                Optional<Day> todayMenu = week.days().stream()
                        .filter(day -> day.date().equals(today))
                        .findFirst();
                
                return todayMenu.map(Day::dishes).orElse(List.of());
            }
        } catch (Exception e) {
            // Log the exception or handle it as appropriate
            System.err.println("Error fetching meals: " + e.getMessage());
        }
        
        return List.of();
    }
}
