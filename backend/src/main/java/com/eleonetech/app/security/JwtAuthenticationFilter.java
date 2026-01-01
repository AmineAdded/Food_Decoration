package com.eleonetech.app.security;

import com.eleonetech.app.service.JwtService;
import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import lombok.RequiredArgsConstructor;
import org.springframework.lang.NonNull;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.security.core.userdetails.UserDetailsService;
import org.springframework.security.web.authentication.WebAuthenticationDetailsSource;
import org.springframework.stereotype.Component;
import org.springframework.web.filter.OncePerRequestFilter;

import java.io.IOException;
import java.util.Arrays;
import java.util.List;

@Component
@RequiredArgsConstructor
public class JwtAuthenticationFilter extends OncePerRequestFilter {

    private final JwtService jwtService;
    private final UserDetailsService userDetailsService;

    // Routes publiques qui ne nécessitent PAS de validation JWT
    private static final List<String> EXCLUDED_PATHS = Arrays.asList(
            "/api/auth/login",
            "/api/auth/signup",
            "/api/auth/forgot-password",
            "/api/auth/verify-otp",
            "/api/auth/reset-password",
            "/api/auth/test"
    );

    /**
     * Détermine si ce filtre doit être appliqué à la requête
     * Retourne true pour IGNORER le filtre (routes publiques)
     */
    @Override
    protected boolean shouldNotFilter(HttpServletRequest request) {
        String path = request.getRequestURI();
        boolean shouldExclude = EXCLUDED_PATHS.stream().anyMatch(path::startsWith);

        if (shouldExclude) {
            System.out.println("✅ Route publique ignorée par JWT filter: " + path);
        }

        return shouldExclude;
    }

    @Override
    protected void doFilterInternal(
            @NonNull HttpServletRequest request,
            @NonNull HttpServletResponse response,
            @NonNull FilterChain filterChain
    ) throws ServletException, IOException {
        final String authHeader = request.getHeader("Authorization");
        final String jwt;
        final String userEmail;

        // Si pas de header Authorization ou ne commence pas par "Bearer "
        if (authHeader == null || !authHeader.startsWith("Bearer ")) {
            filterChain.doFilter(request, response);
            return;
        }

        try {
            jwt = authHeader.substring(7);
            userEmail = jwtService.extractUsername(jwt);

            if (userEmail != null && SecurityContextHolder.getContext().getAuthentication() == null) {
                UserDetails userDetails = this.userDetailsService.loadUserByUsername(userEmail);

                if (jwtService.isTokenValid(jwt, userDetails)) {
                    UsernamePasswordAuthenticationToken authToken = new UsernamePasswordAuthenticationToken(
                            userDetails,
                            null,
                            userDetails.getAuthorities()
                    );
                    authToken.setDetails(new WebAuthenticationDetailsSource().buildDetails(request));
                    SecurityContextHolder.getContext().setAuthentication(authToken);

                    System.out.println("✅ Utilisateur authentifié: " + userEmail);
                }
            }
        } catch (io.jsonwebtoken.ExpiredJwtException e) {
            // Token expiré - on laisse passer sans authentification
            // La route protégée retournera 401/403 automatiquement
            System.out.println("⚠️ JWT Token expiré pour la requête: " + request.getRequestURI());
        } catch (io.jsonwebtoken.MalformedJwtException e) {
            System.out.println("❌ JWT Token malformé: " + e.getMessage());
        } catch (io.jsonwebtoken.SignatureException e) {
            System.out.println("❌ JWT Signature invalide: " + e.getMessage());
        } catch (Exception e) {
            System.out.println("❌ Erreur lors de la validation JWT: " + e.getMessage());
        }

        filterChain.doFilter(request, response);
    }
}