# Kafka useful commands

Rescale partition
```shell
docker compose exec -it kafka /opt/bitnami/kafka/bin/kafka-topics.sh \
  --bootstrap-server kafka:29092 --alter --topic collector.process.signature --partitions 4
```
