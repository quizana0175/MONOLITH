package edu.cit.quizana.supplier;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpStatusCode;
import org.springframework.http.MediaType;
import org.springframework.http.client.SimpleClientHttpRequestFactory;
import org.springframework.stereotype.Component;
import org.springframework.web.client.RestClient;

import java.time.Duration;

@Component
class LegacySupplyHttpClient {

    private static final Logger log = LoggerFactory.getLogger(LegacySupplyHttpClient.class);

    private final String baseUrl;
    private final String clientId;
    private final String apiKey;
    private final RestClient restClient;

    private String sessionToken;

    public LegacySupplyHttpClient(
            @Value("${legacysupply.base-url:https://legacysupply.onrender.com/api/v1}") String baseUrl,
            @Value("${legacysupply.client-id:${LS_CLIENT_ID:2023-00001}}") String clientId,
            @Value("${legacysupply.api-key:${LS_API_KEY:}}") String apiKey) {
        this.baseUrl = baseUrl;
        this.clientId = clientId;
        this.apiKey = apiKey;

        SimpleClientHttpRequestFactory factory = new SimpleClientHttpRequestFactory();
        factory.setConnectTimeout(Duration.ofSeconds(3));
        factory.setReadTimeout(Duration.ofSeconds(3));

        this.restClient = RestClient.builder()
                .baseUrl(baseUrl)
                .requestFactory(factory)
                .messageConverters(converters -> converters.add(new org.springframework.http.converter.xml.MappingJackson2XmlHttpMessageConverter()))
                .build();
    }

    private synchronized String getOrRenewSession() {
        if (this.sessionToken != null) {
            return this.sessionToken;
        }
        return renewSession();
    }

    public synchronized String renewSession() {
        log.info("Requesting new LegacySupply session token for ClientId: {}", clientId);
        AuthRequest req = new AuthRequest(clientId, apiKey);

        AuthResponse resp = restClient.post()
                .uri("/auth/token")
                .contentType(MediaType.APPLICATION_XML)
                .accept(MediaType.APPLICATION_XML)
                .body(req)
                .retrieve()
                .body(AuthResponse.class);

        if (resp != null && resp.sessionToken != null) {
            this.sessionToken = resp.sessionToken;
            log.info("Acquired LegacySupply session token successfully");
            return this.sessionToken;
        }
        throw new IllegalStateException("Failed to obtain LegacySupply session token");
    }

    public PurchaseOrderAck sendPurchaseOrder(String requestId, PurchaseOrderXmlRequest body) {
        return executeWithSessionRetry(() ->
            restClient.post()
                    .uri("/purchase-orders")
                    .contentType(MediaType.APPLICATION_XML)
                    .accept(MediaType.APPLICATION_XML)
                    .header("X-LS-Session", getOrRenewSession())
                    .header("X-Request-Id", requestId)
                    .body(body)
                    .retrieve()
                    .body(PurchaseOrderAck.class)
        );
    }

    public PurchaseOrderStatusResponse checkOrderStatus(String poNumber) {
        return executeWithSessionRetry(() ->
            restClient.get()
                    .uri("/purchase-orders/{poNumber}", poNumber)
                    .accept(MediaType.APPLICATION_XML)
                    .header("X-LS-Session", getOrRenewSession())
                    .retrieve()
                    .body(PurchaseOrderStatusResponse.class)
        );
    }

    private <T> T executeWithSessionRetry(SupplierCall<T> call) {
        try {
            return call.execute();
        } catch (org.springframework.web.client.HttpClientErrorException.Unauthorized ex) {
            log.warn("Session token expired or rejected. Refreshing session and retrying once...");
            renewSession();
            return call.execute();
        }
    }

    @FunctionalInterface
    interface SupplierCall<T> {
        T execute();
    }
}