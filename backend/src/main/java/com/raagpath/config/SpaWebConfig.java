package com.raagpath.config;

import org.springframework.context.annotation.Configuration;
import org.springframework.core.io.Resource;
import org.springframework.web.servlet.config.annotation.ResourceHandlerRegistry;
import org.springframework.web.servlet.config.annotation.WebMvcConfigurer;
import org.springframework.web.servlet.resource.PathResourceResolver;

import java.io.IOException;

/**
 * SPA static-file routing fix.
 *
 * Problem: Next.js static export with trailingSlash:true generates
 *   /practice/index.html   — but Spring Boot won't serve it for GET /practice
 *   (no trailing slash).  Direct URL access returns 404.
 *
 * Fix: custom PathResourceResolver that, when the exact path isn't found,
 *   falls back to <path>/index.html — so /practice → /practice/index.html.
 *
 * API routes (/api/**) are handled by Spring MVC controllers before this
 * resolver runs, so they are never affected.
 */
@Configuration
public class SpaWebConfig implements WebMvcConfigurer {

    @Override
    public void addResourceHandlers(ResourceHandlerRegistry registry) {
        registry
            .addResourceHandler("/**")
            .addResourceLocations("classpath:/static/")
            .resourceChain(true)
            .addResolver(new PathResourceResolver() {
                @Override
                protected Resource getResource(String resourcePath, Resource location)
                        throws IOException {

                    // 1. Try exact path (e.g. /_next/static/..., /favicon.ico)
                    Resource resource = location.createRelative(resourcePath);
                    if (resource.exists() && resource.isReadable()) {
                        return resource;
                    }

                    // 2. Try <path>/index.html (e.g. /practice → /practice/index.html)
                    String withIndex = resourcePath.endsWith("/")
                        ? resourcePath + "index.html"
                        : resourcePath + "/index.html";
                    Resource indexResource = location.createRelative(withIndex);
                    if (indexResource.exists() && indexResource.isReadable()) {
                        return indexResource;
                    }

                    // 3. Not found — let Spring MVC return 404 normally
                    return null;
                }
            });
    }
}
