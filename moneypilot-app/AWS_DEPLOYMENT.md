# AWS Deployment Guide for MoneyPilot

This guide covers multiple AWS deployment options for MoneyPilot.

## Prerequisites

1. **AWS Account** with appropriate permissions
2. **AWS CLI** installed and configured (`aws configure`)
3. **Docker** installed locally (for container builds)
4. **Supabase Project** already set up with the schema

## Environment Variables Required

```bash
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
ANTHROPIC_API_KEY=your-anthropic-api-key
```

---

## Option 1: AWS App Runner (Recommended - Easiest)

AWS App Runner is the simplest way to deploy containerized apps.

### Step 1: Push to Amazon ECR

```bash
# Create ECR repository
aws ecr create-repository --repository-name moneypilot --region ap-northeast-1

# Login to ECR
aws ecr get-login-password --region ap-northeast-1 | docker login --username AWS --password-stdin YOUR_ACCOUNT_ID.dkr.ecr.ap-northeast-1.amazonaws.com

# Build the image
docker build \
  --build-arg NEXT_PUBLIC_SUPABASE_URL=your-url \
  --build-arg NEXT_PUBLIC_SUPABASE_ANON_KEY=your-key \
  -t moneypilot .

# Tag and push
docker tag moneypilot:latest YOUR_ACCOUNT_ID.dkr.ecr.ap-northeast-1.amazonaws.com/moneypilot:latest
docker push YOUR_ACCOUNT_ID.dkr.ecr.ap-northeast-1.amazonaws.com/moneypilot:latest
```

### Step 2: Create App Runner Service

1. Go to **AWS Console → App Runner**
2. Click **Create service**
3. Choose **Container registry → Amazon ECR**
4. Select your `moneypilot` image
5. Configure:
   - **Port**: 3000
   - **CPU**: 1 vCPU
   - **Memory**: 2 GB
6. Add environment variables:
   - `SUPABASE_SERVICE_ROLE_KEY`
   - `ANTHROPIC_API_KEY`
7. Click **Create & deploy**

**Cost**: ~$25-50/month for basic usage

---

## Option 2: AWS ECS with Fargate (Production-Ready)

Better for production with more control.

### Step 1: Create ECS Cluster

```bash
aws ecs create-cluster --cluster-name moneypilot-cluster --region ap-northeast-1
```

### Step 2: Create Task Definition

Create `ecs-task-definition.json`:

```json
{
  "family": "moneypilot",
  "networkMode": "awsvpc",
  "requiresCompatibilities": ["FARGATE"],
  "cpu": "512",
  "memory": "1024",
  "executionRoleArn": "arn:aws:iam::YOUR_ACCOUNT:role/ecsTaskExecutionRole",
  "containerDefinitions": [
    {
      "name": "moneypilot",
      "image": "YOUR_ACCOUNT.dkr.ecr.ap-northeast-1.amazonaws.com/moneypilot:latest",
      "portMappings": [
        {
          "containerPort": 3000,
          "protocol": "tcp"
        }
      ],
      "environment": [
        {"name": "SUPABASE_SERVICE_ROLE_KEY", "value": "your-key"},
        {"name": "ANTHROPIC_API_KEY", "value": "your-key"}
      ],
      "logConfiguration": {
        "logDriver": "awslogs",
        "options": {
          "awslogs-group": "/ecs/moneypilot",
          "awslogs-region": "ap-northeast-1",
          "awslogs-stream-prefix": "ecs"
        }
      }
    }
  ]
}
```

```bash
aws ecs register-task-definition --cli-input-json file://ecs-task-definition.json
```

### Step 3: Create Service with ALB

1. Create an **Application Load Balancer** in VPC
2. Create **Target Group** (port 3000, health check `/`)
3. Create ECS Service:

```bash
aws ecs create-service \
  --cluster moneypilot-cluster \
  --service-name moneypilot-service \
  --task-definition moneypilot \
  --desired-count 2 \
  --launch-type FARGATE \
  --network-configuration "awsvpcConfiguration={subnets=[subnet-xxx],securityGroups=[sg-xxx],assignPublicIp=ENABLED}" \
  --load-balancers "targetGroupArn=arn:aws:elasticloadbalancing:...,containerName=moneypilot,containerPort=3000"
```

**Cost**: ~$50-100/month depending on traffic

---

## Option 3: AWS Amplify (Serverless)

Best for simple deployments with Git integration.

### Step 1: Connect Repository

1. Go to **AWS Amplify Console**
2. Click **Host web app**
3. Connect your GitHub/GitLab/Bitbucket repo
4. Select the `moneypilot-app` folder as the root

### Step 2: Configure Build Settings

Amplify will auto-detect Next.js. Update `amplify.yml`:

```yaml
version: 1
frontend:
  phases:
    preBuild:
      commands:
        - npm ci
    build:
      commands:
        - npm run build
  artifacts:
    baseDirectory: .next
    files:
      - '**/*'
  cache:
    paths:
      - node_modules/**/*
```

### Step 3: Add Environment Variables

In Amplify Console → App settings → Environment variables:
- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- `SUPABASE_SERVICE_ROLE_KEY`
- `ANTHROPIC_API_KEY`

**Cost**: Pay per request, typically $5-20/month for low traffic

---

## Option 4: EC2 with Docker (Full Control)

For maximum control and cost optimization.

### Step 1: Launch EC2 Instance

```bash
# Launch Amazon Linux 2023 instance
aws ec2 run-instances \
  --image-id ami-0abcdef1234567890 \
  --instance-type t3.small \
  --key-name your-key \
  --security-group-ids sg-xxx \
  --subnet-id subnet-xxx
```

### Step 2: Install Docker on EC2

```bash
# SSH into instance
ssh -i your-key.pem ec2-user@your-instance-ip

# Install Docker
sudo yum update -y
sudo yum install docker -y
sudo systemctl start docker
sudo systemctl enable docker
sudo usermod -aG docker ec2-user

# Install Docker Compose
sudo curl -L "https://github.com/docker/compose/releases/latest/download/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose
sudo chmod +x /usr/local/bin/docker-compose
```

### Step 3: Deploy Application

```bash
# Clone your repo or copy files
git clone your-repo
cd moneypilot-app

# Create .env file
cat > .env << EOF
NEXT_PUBLIC_SUPABASE_URL=your-url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-key
SUPABASE_SERVICE_ROLE_KEY=your-key
ANTHROPIC_API_KEY=your-key
EOF

# Build and run
docker-compose up -d --build
```

### Step 4: Set Up Nginx Reverse Proxy (Optional)

```bash
sudo yum install nginx -y

# Configure nginx
sudo cat > /etc/nginx/conf.d/moneypilot.conf << EOF
server {
    listen 80;
    server_name your-domain.com;

    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade \$http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host \$host;
        proxy_cache_bypass \$http_upgrade;
    }
}
EOF

sudo systemctl start nginx
sudo systemctl enable nginx
```

**Cost**: ~$15-30/month for t3.small

---

## SSL/HTTPS Setup

### Option A: AWS Certificate Manager (for ALB/CloudFront)

1. Request certificate in ACM
2. Add DNS validation record
3. Attach to ALB or CloudFront

### Option B: Let's Encrypt (for EC2)

```bash
sudo yum install certbot python3-certbot-nginx -y
sudo certbot --nginx -d your-domain.com
```

---

## Custom Domain Setup

1. **Route 53**: Create hosted zone for your domain
2. **Create A Record**: Point to your ALB/EC2/App Runner endpoint
3. **SSL**: Use ACM certificate

---

## Monitoring & Logging

### CloudWatch

```bash
# Create log group
aws logs create-log-group --log-group-name /moneypilot/app

# View logs
aws logs tail /moneypilot/app --follow
```

### Health Check Endpoint

Add to your app (already available at `/api/health` or use `/`).

---

## CI/CD with GitHub Actions

Create `.github/workflows/deploy.yml`:

```yaml
name: Deploy to AWS

on:
  push:
    branches: [main]

jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      
      - name: Configure AWS credentials
        uses: aws-actions/configure-aws-credentials@v4
        with:
          aws-access-key-id: ${{ secrets.AWS_ACCESS_KEY_ID }}
          aws-secret-access-key: ${{ secrets.AWS_SECRET_ACCESS_KEY }}
          aws-region: ap-northeast-1

      - name: Login to Amazon ECR
        id: login-ecr
        uses: aws-actions/amazon-ecr-login@v2

      - name: Build and push Docker image
        env:
          ECR_REGISTRY: ${{ steps.login-ecr.outputs.registry }}
          ECR_REPOSITORY: moneypilot
          IMAGE_TAG: ${{ github.sha }}
        run: |
          docker build \
            --build-arg NEXT_PUBLIC_SUPABASE_URL=${{ secrets.NEXT_PUBLIC_SUPABASE_URL }} \
            --build-arg NEXT_PUBLIC_SUPABASE_ANON_KEY=${{ secrets.NEXT_PUBLIC_SUPABASE_ANON_KEY }} \
            -t $ECR_REGISTRY/$ECR_REPOSITORY:$IMAGE_TAG \
            -t $ECR_REGISTRY/$ECR_REPOSITORY:latest .
          docker push $ECR_REGISTRY/$ECR_REPOSITORY:$IMAGE_TAG
          docker push $ECR_REGISTRY/$ECR_REPOSITORY:latest

      - name: Deploy to App Runner
        run: |
          aws apprunner start-deployment --service-arn ${{ secrets.APP_RUNNER_SERVICE_ARN }}
```

---

## Quick Start Commands

```bash
# Test locally with Docker
docker-compose up --build

# Build for production
docker build \
  --build-arg NEXT_PUBLIC_SUPABASE_URL=your-url \
  --build-arg NEXT_PUBLIC_SUPABASE_ANON_KEY=your-key \
  -t moneypilot .

# Run production container
docker run -p 3000:3000 \
  -e SUPABASE_SERVICE_ROLE_KEY=your-key \
  -e ANTHROPIC_API_KEY=your-key \
  moneypilot
```

---

## Recommended Setup for Production

| Component | Recommendation |
|-----------|---------------|
| **Compute** | AWS App Runner or ECS Fargate |
| **Database** | Supabase (managed) |
| **Storage** | Supabase Storage |
| **CDN** | CloudFront |
| **Domain** | Route 53 |
| **SSL** | ACM |
| **Monitoring** | CloudWatch |
| **CI/CD** | GitHub Actions |

**Estimated Monthly Cost**: $30-100 depending on traffic
