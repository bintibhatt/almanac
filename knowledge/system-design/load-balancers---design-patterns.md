---
title: "Load Balancers - Design Patterns"
category: "system-design"
date: "2026-07-09"
---

## What is it?

A load balancer is a critical component in distributed systems that efficiently distributes incoming network traffic across multiple servers or resources. Design patterns for load balancers refer to reusable architectural solutions that address common challenges in traffic distribution, high availability, and scalability.

## Why it matters

Load balancers are fundamental to modern web architectures because:
- They prevent any single server from becoming overloaded
- Improve application responsiveness and availability
- Enable horizontal scaling of services
- Provide fault tolerance by rerouting traffic from failed instances
- Help implement zero-downtime deployments
- Can provide security benefits by hiding internal infrastructure

Without proper load balancing patterns, systems risk performance bottlenecks, single points of failure, and inability to handle traffic spikes.

## How it works

Load balancers operate using several key mechanisms:

1. **Health Checks**: Continuously monitor server availability
2. **Algorithm Selection**: Choose appropriate distribution logic
3. **Session Persistence**: Maintain user sessions when needed
4. **Traffic Routing**: Direct requests based on various criteria

Common distribution algorithms include:
- Round Robin (sequential distribution)
- Least Connections (busiest server avoidance)
- IP Hash (consistent client-server mapping)
- Weighted (capacity-based distribution)

## Example

Here's a practical example using NGINX as a load balancer:

```nginx
http {
  upstream backend {
    # Define load balancing algorithm
    least_conn;
    
    # List of backend servers with optional weights
    server backend1.example.com weight=3;
    server backend2.example.com;
    server backup.example.com backup;
  }

  server {
    listen 80;
    
    location / {
      proxy_pass http://backend;
      proxy_set_header Host $host;
    }
  }
}
```

For cloud environments, here's a Terraform example creating an AWS Application Load Balancer:

```hcl
resource "aws_lb" "app_lb" {
  name               = "app-load-balancer"
  internal           = false
  load_balancer_type = "application"
  security_groups    = [aws_security_group.lb_sg.id]
  subnets            = aws_subnet.public.*.id
}

resource "aws_lb_target_group" "app_tg" {
  name     = "app-target-group"
  port     = 80
  protocol = "HTTP"
  vpc_id   = aws_vpc.main.id

  health_check {
    path                = "/health"
    interval            = 30
    timeout             = 5
    healthy_threshold   = 2
    unhealthy_threshold = 2
  }
}
```

## Key Takeaways

- **Algorithm Choice Matters**: Different patterns (round robin, least connections, etc.) suit different workloads
- **Health Monitoring is Critical**: Regular checks prevent traffic routing to failed instances
- **Layer Awareness**: Application (L7) vs Network (L4) load balancers serve different needs
- **Session Handling**: Some applications require sticky sessions while others benefit from stateless distribution
- **Cloud Integration**: Modern cloud providers offer managed load balancing services with auto-scaling capabilities
- **Security Considerations**: Load balancers can provide SSL termination and DDoS protection
- **Performance Impact**: Proper configuration prevents the load balancer itself from becoming a bottleneck
