-- MySQL dump 10.13  Distrib 8.0.46, for Win64 (x86_64)
--
-- Host: localhost    Database: otes_db
-- ------------------------------------------------------
-- Server version	9.7.0

/*!40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT */;
/*!40101 SET @OLD_CHARACTER_SET_RESULTS=@@CHARACTER_SET_RESULTS */;
/*!40101 SET @OLD_COLLATION_CONNECTION=@@COLLATION_CONNECTION */;
/*!50503 SET NAMES utf8mb4 */;
/*!40103 SET @OLD_TIME_ZONE=@@TIME_ZONE */;
/*!40103 SET TIME_ZONE='+00:00' */;
/*!40014 SET @OLD_UNIQUE_CHECKS=@@UNIQUE_CHECKS, UNIQUE_CHECKS=0 */;
/*!40014 SET @OLD_FOREIGN_KEY_CHECKS=@@FOREIGN_KEY _CHECKS, FOREIGN_KEY_CHECKS=0 */;
/*!40101 SET @OLD_SQL_MODE=@@SQL_MODE, SQL_MODE='NO_AUTO_VALUE_ON_ZERO' */;
/*!40111 SET @OLD_SQL_NOTES=@@SQL_NOTES, SQL_NOTES=0 */;

--
-- Table structure for table `chat_messages`
--

DROP TABLE IF EXISTS `chat_messages`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `chat_messages` (
  `id` int NOT NULL AUTO_INCREMENT,
  `task_id` int NOT NULL,
  `sender_id` int NOT NULL,
  `receiver_id` int NOT NULL,
  `message` text NOT NULL,
  `is_read` tinyint(1) NOT NULL DEFAULT '0',
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `task_id` (`task_id`),
  KEY `sender_id` (`sender_id`),
  KEY `receiver_id` (`receiver_id`),
  CONSTRAINT `chat_messages_ibfk_1` FOREIGN KEY (`task_id`) REFERENCES `tasks` (`id`) ON DELETE CASCADE,
  CONSTRAINT `chat_messages_ibfk_2` FOREIGN KEY (`sender_id`) REFERENCES `users` (`id`),
  CONSTRAINT `chat_messages_ibfk_3` FOREIGN KEY (`receiver_id`) REFERENCES `users` (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=63 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `chat_messages`
--

LOCK TABLES `chat_messages` WRITE;
/*!40000 ALTER TABLE `chat_messages` DISABLE KEYS */;
INSERT INTO `chat_messages` VALUES (1,1,2,1,'Hi, I started working on the task.',1,'2026-06-22 19:39:55'),(2,1,2,1,'י',1,'2026-06-23 15:50:18'),(3,1,1,2,'מ',1,'2026-06-23 15:53:55'),(4,8,2,1,'Performer finished the step of: On my way',1,'2026-06-23 15:54:34'),(5,8,2,1,'Performer finished the step of: Task in progress',1,'2026-06-23 15:58:21'),(6,4,2,1,'Performer finished the step of: Finalizing the task',1,'2026-06-23 16:02:17'),(7,4,2,1,'הכ',1,'2026-06-23 16:02:28'),(8,1,1,2,'c',1,'2026-06-23 16:05:32'),(9,1,2,1,'ע',1,'2026-06-23 16:06:39'),(10,1,1,2,'ב',1,'2026-06-23 16:56:44'),(11,1,2,1,'c',1,'2026-06-23 17:03:56'),(12,2,2,1,'גב',0,'2026-06-23 17:16:08'),(13,1,2,1,'גד',1,'2026-06-23 17:16:20'),(14,4,2,1,'Performer finished the step of: Task completed',1,'2026-06-23 17:16:31'),(15,1,3,1,'jndckj',1,'2026-06-25 14:31:47'),(16,1,2,1,'vvc',1,'2026-06-25 14:32:27'),(17,8,1,2,'היי אסתכל עכשיו',1,'2026-06-26 10:14:49'),(18,1,1,2,'היי',1,'2026-06-26 10:37:36'),(19,6,1,5,'היי',1,'2026-06-26 10:38:25'),(20,10,1,5,'היי',1,'2026-06-26 12:22:37'),(21,10,5,1,'מה קורה?',1,'2026-06-26 12:22:48'),(22,10,1,5,'בסדר מה אתך?',1,'2026-06-26 12:23:25'),(23,6,5,1,'היי',1,'2026-06-26 12:24:43'),(24,6,1,5,'מה נשמע?',1,'2026-06-26 12:24:58'),(25,10,5,1,'הי',1,'2026-06-26 12:34:16'),(26,10,1,5,'בסדק',1,'2026-06-26 12:34:31'),(27,6,5,1,'Performer finished the step of: Finalizing the task',1,'2026-06-26 12:35:06'),(28,6,5,1,'Performer finished the step of: Task completed',1,'2026-06-26 12:35:06'),(29,10,5,1,'היי',1,'2026-06-26 12:39:49'),(30,10,1,5,'מה קורה?',1,'2026-06-26 12:39:59'),(31,11,5,1,'Performer finished the step of: On my way',1,'2026-06-26 12:52:34'),(32,11,5,1,'Performer finished the step of: Task in progress',1,'2026-06-26 12:52:34'),(33,11,5,1,'Performer finished the step of: Finalizing the task',1,'2026-06-26 12:52:35'),(34,11,5,1,'Performer finished the step of: Task completed',1,'2026-06-26 12:52:35'),(35,11,5,1,'Task ended',1,'2026-06-26 12:52:35'),(36,12,5,1,'Performer finished the step of: On my way',1,'2026-06-26 13:04:01'),(37,12,5,1,'Performer finished the step of: Task in progress',1,'2026-06-26 13:04:02'),(38,12,5,1,'Performer finished the step of: Finalizing the task',1,'2026-06-26 13:04:52'),(39,12,5,1,'Performer finished the step of: Task completed',1,'2026-06-26 13:04:53'),(40,12,5,1,'Task ended',1,'2026-06-26 13:04:53'),(41,13,5,1,'Performer finished the step of: On my way',1,'2026-06-26 13:20:10'),(42,13,5,1,'Performer finished the step of: Task in progress',1,'2026-06-26 13:20:22'),(43,13,5,1,'Performer finished the step of: Finalizing the task',1,'2026-06-26 13:20:22'),(44,13,5,1,'Performer finished the step of: Task completed',1,'2026-06-26 13:20:22'),(45,13,5,1,'Task ended',1,'2026-06-26 13:20:22'),(46,14,5,1,'Task accepted by 1000liorz',1,'2026-06-26 13:25:51'),(47,15,5,1,'Task accepted by 1000liorz',1,'2026-06-26 13:30:23'),(48,15,5,1,'Performer finished the step of: On my way',1,'2026-06-26 13:30:27'),(49,14,5,1,'Task accepted by 1000liorz',1,'2026-06-26 13:30:48'),(50,14,5,1,'Performer finished the step of: On my way',1,'2026-06-26 13:30:54'),(51,16,5,1,'Task accepted by 1000liorz',1,'2026-06-26 14:32:18'),(52,16,5,1,'Performer finished the step of: On my way',1,'2026-06-26 14:32:22'),(53,16,5,1,'Performer finished the step of: Task in progress',1,'2026-06-26 14:32:22'),(54,16,5,1,'Performer finished the step of: Finalizing the task',1,'2026-06-26 14:32:22'),(55,16,5,1,'Performer finished the step of: Task completed',1,'2026-06-26 14:32:22'),(56,16,5,1,'Task ended',1,'2026-06-26 14:32:22'),(57,17,5,1,'Task accepted by 1000liorz',1,'2026-06-26 14:37:43'),(58,17,5,1,'Performer finished the step of: On my way',1,'2026-06-26 14:37:47'),(59,17,5,1,'Performer finished the step of: Task in progress',1,'2026-06-26 14:37:47'),(60,17,5,1,'Performer finished the step of: Finalizing the task',1,'2026-06-26 14:37:47'),(61,17,5,1,'Performer finished the step of: Task completed',1,'2026-06-26 14:37:47'),(62,17,5,1,'Task ended',1,'2026-06-26 14:37:47');
/*!40000 ALTER TABLE `chat_messages` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `notifications`
--

DROP TABLE IF EXISTS `notifications`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `notifications` (
  `id` int NOT NULL AUTO_INCREMENT,
  `user_id` int NOT NULL,
  `task_id` int DEFAULT NULL,
  `type` enum('payment','report','task_cancelled','general') NOT NULL DEFAULT 'general',
  `title` varchar(150) NOT NULL,
  `message` text NOT NULL,
  `is_read` tinyint(1) NOT NULL DEFAULT '0',
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `user_id` (`user_id`),
  KEY `task_id` (`task_id`),
  CONSTRAINT `notifications_ibfk_1` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE,
  CONSTRAINT `notifications_ibfk_2` FOREIGN KEY (`task_id`) REFERENCES `tasks` (`id`) ON DELETE SET NULL
) ENGINE=InnoDB AUTO_INCREMENT=4 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `notifications`
--

LOCK TABLES `notifications` WRITE;
/*!40000 ALTER TABLE `notifications` DISABLE KEYS */;
INSERT INTO `notifications` VALUES (2,1,1,'report','Report Submitted','Your report has been submitted and is waiting for review.',0,'2026-06-22 19:59:10'),(3,2,1,'task_cancelled','Task Cancelled','The requester cancelled the task.',0,'2026-06-22 19:59:31');
/*!40000 ALTER TABLE `notifications` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `payments`
--

DROP TABLE IF EXISTS `payments`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `payments` (
  `id` int NOT NULL AUTO_INCREMENT,
  `task_id` int NOT NULL,
  `requester_id` int NOT NULL,
  `performer_id` int NOT NULL,
  `amount` decimal(10,2) NOT NULL,
  `status` enum('pending','approved','rejected','paid') NOT NULL DEFAULT 'pending',
  `receipt_number` varchar(80) DEFAULT NULL,
  `paid_at` timestamp NULL DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `task_id` (`task_id`),
  KEY `requester_id` (`requester_id`),
  KEY `performer_id` (`performer_id`),
  CONSTRAINT `payments_ibfk_1` FOREIGN KEY (`task_id`) REFERENCES `tasks` (`id`) ON DELETE CASCADE,
  CONSTRAINT `payments_ibfk_2` FOREIGN KEY (`requester_id`) REFERENCES `users` (`id`),
  CONSTRAINT `payments_ibfk_3` FOREIGN KEY (`performer_id`) REFERENCES `users` (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=3 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `payments`
--

LOCK TABLES `payments` WRITE;
/*!40000 ALTER TABLE `payments` DISABLE KEYS */;
INSERT INTO `payments` VALUES (1,1,1,2,150.00,'paid','OTES-1-1782203773233','2026-06-23 08:36:13','2026-06-23 08:35:22'),(2,3,2,3,100.00,'pending',NULL,NULL,'2026-06-23 08:54:55');
/*!40000 ALTER TABLE `payments` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `ratings`
--

DROP TABLE IF EXISTS `ratings`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `ratings` (
  `id` int NOT NULL AUTO_INCREMENT,
  `task_id` int NOT NULL,
  `requester_id` int NOT NULL,
  `performer_id` int NOT NULL,
  `rating` int NOT NULL,
  `feedback` text,
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `task_id` (`task_id`),
  KEY `reviewer_id` (`requester_id`),
  KEY `reviewed_user_id` (`performer_id`),
  CONSTRAINT `ratings_ibfk_1` FOREIGN KEY (`task_id`) REFERENCES `tasks` (`id`) ON DELETE CASCADE,
  CONSTRAINT `ratings_ibfk_2` FOREIGN KEY (`requester_id`) REFERENCES `users` (`id`),
  CONSTRAINT `ratings_ibfk_3` FOREIGN KEY (`performer_id`) REFERENCES `users` (`id`),
  CONSTRAINT `ratings_chk_1` CHECK ((`rating` between 1 and 5))
) ENGINE=InnoDB AUTO_INCREMENT=3 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `ratings`
--

LOCK TABLES `ratings` WRITE;
/*!40000 ALTER TABLE `ratings` DISABLE KEYS */;
INSERT INTO `ratings` VALUES (1,1,1,2,5,'Great work!','2026-06-22 15:25:52'),(2,3,3,2,3,'do better work!','2026-06-22 15:28:43');
/*!40000 ALTER TABLE `ratings` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `reports`
--

DROP TABLE IF EXISTS `reports`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `reports` (
  `id` int NOT NULL AUTO_INCREMENT,
  `reporter_id` int NOT NULL,
  `reported_user_id` int DEFAULT NULL,
  `task_id` int DEFAULT NULL,
  `reason` varchar(150) NOT NULL,
  `description` text,
  `status` enum('open','in-review','closed') NOT NULL DEFAULT 'open',
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `reporter_id` (`reporter_id`),
  KEY `reported_user_id` (`reported_user_id`),
  KEY `task_id` (`task_id`),
  CONSTRAINT `reports_ibfk_1` FOREIGN KEY (`reporter_id`) REFERENCES `users` (`id`),
  CONSTRAINT `reports_ibfk_2` FOREIGN KEY (`reported_user_id`) REFERENCES `users` (`id`) ON DELETE SET NULL,
  CONSTRAINT `reports_ibfk_3` FOREIGN KEY (`task_id`) REFERENCES `tasks` (`id`) ON DELETE SET NULL
) ENGINE=InnoDB AUTO_INCREMENT=9 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `reports`
--

LOCK TABLES `reports` WRITE;
/*!40000 ALTER TABLE `reports` DISABLE KEYS */;
INSERT INTO `reports` VALUES (2,1,2,1,'Inappropriate behavior','The performer did not communicate properly.','closed','2026-06-23 09:30:11','2026-06-23 09:31:54'),(3,3,1,3,'Inappropriate behavior','The performer did not communicate properly.','in-review','2026-06-23 09:30:32','2026-06-23 09:31:30'),(4,2,1,4,'Inappropriate behavior','The performer did not communicate properly.','closed','2026-06-23 09:33:34','2026-06-23 09:41:29'),(5,1,3,6,'Inappropriate behavior','The performer did not communicate properly.','closed','2026-06-23 09:44:21','2026-06-23 09:46:06'),(6,1,5,NULL,'User Report','he is so nice','open','2026-06-26 13:37:46','2026-06-26 13:37:46'),(7,5,3,NULL,'User Report','he is great!','open','2026-06-26 13:44:32','2026-06-26 13:44:32'),(8,5,3,NULL,'Payment Issue','didn`t pay money','open','2026-06-26 13:48:09','2026-06-26 13:48:09');
/*!40000 ALTER TABLE `reports` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `task_attachments`
--

DROP TABLE IF EXISTS `task_attachments`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `task_attachments` (
  `id` int NOT NULL AUTO_INCREMENT,
  `task_id` int NOT NULL,
  `file_name` varchar(255) NOT NULL,
  `file_path` varchar(500) NOT NULL,
  `file_type` varchar(80) DEFAULT NULL,
  `uploaded_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `task_id` (`task_id`),
  CONSTRAINT `task_attachments_ibfk_1` FOREIGN KEY (`task_id`) REFERENCES `tasks` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `task_attachments`
--

LOCK TABLES `task_attachments` WRITE;
/*!40000 ALTER TABLE `task_attachments` DISABLE KEYS */;
/*!40000 ALTER TABLE `task_attachments` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `tasks`
--

DROP TABLE IF EXISTS `tasks`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `tasks` (
  `id` int NOT NULL AUTO_INCREMENT,
  `title` varchar(150) NOT NULL,
  `description` text NOT NULL,
  `location` varchar(100) DEFAULT NULL,
  `difficulty` varchar(50) DEFAULT NULL,
  `payment` decimal(10,2) DEFAULT NULL,
  `additional_details` text,
  `category` varchar(100) DEFAULT NULL,
  `state` varchar(50) DEFAULT 'open',
  `work_status` varchar(100) DEFAULT 'Available',
  `requester_id` int NOT NULL,
  `performer_id` int DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `deadline` date DEFAULT NULL,
  `started_at` datetime DEFAULT NULL,
  `completed_at` datetime DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `requester_id` (`requester_id`),
  KEY `performer_id` (`performer_id`),
  CONSTRAINT `tasks_ibfk_1` FOREIGN KEY (`requester_id`) REFERENCES `users` (`id`),
  CONSTRAINT `tasks_ibfk_2` FOREIGN KEY (`performer_id`) REFERENCES `users` (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=18 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `tasks`
--

LOCK TABLES `tasks` WRITE;
/*!40000 ALTER TABLE `tasks` DISABLE KEYS */;
INSERT INTO `tasks` VALUES (1,'Design a Logo','Need a modern logo for my startup company','Remote','Medium',150.00,'Include different formats and color versions.','Design','in-progress','Task in progress',1,2,'2026-06-22 10:54:07','2026-02-15',NULL,NULL),(2,'Write Product Description','Write compelling product descriptions for an e-commerce site','Remote','Easy',75.00,'my kid is now at falcon high school.','delivery','open','Available',1,3,'2026-06-22 10:54:07','2026-03-10',NULL,NULL),(3,'key delivery','bring my kid a key','Tel-Aviv','Easy',15.00,'Descriptions should be short, clear, and sales focused.','Writing','completed','Task completed',1,5,'2026-06-22 10:54:07','2026-02-07',NULL,NULL),(4,'Design a Logo','Need a modern logo for my startup company','Remote','Medium',150.00,'Include different formats and color versions.','Design','completed','Task completed',1,2,'2026-06-22 10:56:58','2026-02-13',NULL,NULL),(6,'key delivery','bring my kid a key','Tel-Aviv','Easy',15.00,'my kid is now at falcon high school.','Delivery','completed','Task completed',1,5,'2026-06-22 10:56:58','2026-02-06',NULL,NULL),(8,'check the system','check if the system works','Tel Aviv','Medium',2.00,'check if works','General','in-progress','Task in progress',1,2,'2026-06-23 13:26:03',NULL,NULL,NULL),(9,'add someting','add something something','Lod','Easy',4.00,'add','General','cancelled','Cancelled',1,NULL,'2026-06-26 11:34:30',NULL,NULL,NULL),(10,'123','123','`Aseret','Medium',4.00,'קק','General','completed','Task completed',1,5,'2026-06-26 11:50:59',NULL,NULL,NULL),(11,'123','בגב','`En HaShelosha','Medium',2.00,'בש','General','completed','Task completed',1,5,'2026-06-26 12:52:02',NULL,NULL,NULL),(12,'123','123','`Arugot','Hard',2.00,'דס','General','completed','Task completed',1,5,'2026-06-26 13:03:32',NULL,NULL,NULL),(13,'222','222','`Arugot','Medium',2.00,'222','General','in-progress','Finalizing the task',1,5,'2026-06-26 13:19:17',NULL,NULL,NULL),(14,'222','222','`Arugot','Hard',2.00,'222','General','in-progress','On my way',1,5,'2026-06-26 13:25:45',NULL,NULL,NULL),(15,'222','222','`Arugot','Easy',1.00,'22','General','in-progress','On my way',1,5,'2026-06-26 13:30:17',NULL,NULL,NULL),(16,'333','333','Ashdod','Hard',150.00,'reree','General','completed','Task completed',1,5,'2026-06-26 14:32:09',NULL,NULL,NULL),(17,'333','edw','`Amir','Medium',1.00,'fe','General','completed','Task completed',1,5,'2026-06-26 14:37:34',NULL,NULL,NULL);
/*!40000 ALTER TABLE `tasks` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `users`
--

DROP TABLE IF EXISTS `users`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `users` (
  `id` int NOT NULL AUTO_INCREMENT,
  `full_name` varchar(100) NOT NULL,
  `username` varchar(100) NOT NULL,
  `email` varchar(100) NOT NULL,
  `password` varchar(255) NOT NULL,
  `birth_date` date DEFAULT NULL,
  `phone_number` varchar(20) DEFAULT NULL,
  `gender` varchar(20) DEFAULT NULL,
  `profile_picture` varchar(255) DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `role` varchar(30) DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `mail` (`email`)
) ENGINE=InnoDB AUTO_INCREMENT=9 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `users`
--

LOCK TABLES `users` WRITE;
/*!40000 ALTER TABLE `users` DISABLE KEYS */;
INSERT INTO `users` VALUES (1,'Sarah Johnson','Sara Johnson','sarah@example.com','Test123','1995-01-10','123456789','Female',NULL,'2026-06-22 10:50:34',NULL),(2,'John Dan','John Dan','john@example.com','Test321','1992-04-20','987654321','Male',NULL,'2026-06-22 10:50:34',NULL),(3,'David Cohen','David Cohen','davidcohen@example.com','Test456','2000-05-05','12435687','Male',NULL,'2026-06-22 10:50:34',NULL),(5,'lior zahavi','1000liorz','1000liorz@gmail.com','lior1234','2002-08-14',NULL,'Female','צילום מסך 2026-06-15 133809.png','2026-06-25 14:55:05','Requester'),(7,'Yarden Shriki','Yarden Shriki','Yarden@example.com','Yarden123','2001-11-09','0501234543','Female','profile.jpg','2026-06-26 14:28:40','Performer');
/*!40000 ALTER TABLE `users` ENABLE KEYS */;
UNLOCK TABLES;
/*!40103 SET TIME_ZONE=@OLD_TIME_ZONE */;

/*!40101 SET SQL_MODE=@OLD_SQL_MODE */;
/*!40014 SET FOREIGN_KEY_CHECKS=@OLD_FOREIGN_KEY_CHECKS */;
/*!40014 SET UNIQUE_CHECKS=@OLD_UNIQUE_CHECKS */;
/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
/*!40111 SET SQL_NOTES=@OLD_SQL_NOTES */;

-- Dump completed on 2026-06-26 19:54:50
