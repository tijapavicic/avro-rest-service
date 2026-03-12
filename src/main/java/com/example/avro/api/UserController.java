package com.example.avro.api;

import java.time.Instant;
import java.util.Map;
import java.util.UUID;
import java.util.concurrent.ConcurrentHashMap;

import com.example.avro.model.UserEvent;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.server.ResponseStatusException;
import org.springframework.http.HttpStatus;

@RestController
@RequestMapping("/api/users")
public class UserController {

    private final Map<String, UserEvent> store = new ConcurrentHashMap<>();

    @PostMapping(
            consumes = {"application/avro", "application/avro+json"},
            produces = {"application/avro+json", "application/avro"})
    public UserEvent create(@RequestBody UserEvent event) {
        if (event.getId() == null || event.getId().toString().isBlank()) {
            event.setId(UUID.randomUUID().toString());
        }
        if (event.getCreatedAt() == null) {
            event.setCreatedAt(Instant.now());
        }
        store.put(event.getId().toString(), event);
        return event;
    }

    @GetMapping(
            value = "/{id}",
            produces = {"application/avro+json", "application/avro"})
    public UserEvent get(@PathVariable String id) {
        UserEvent event = store.get(id);
        if (event == null) {
            throw new ResponseStatusException(HttpStatus.NOT_FOUND, "User not found");
        }
        return event;
    }
}
