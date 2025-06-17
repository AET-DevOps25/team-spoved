package de.tum.aet.devops25.teamspoved.model;

import jakarta.persistence.*;
import com.fasterxml.jackson.annotation.JsonIgnoreProperties;

@Entity
@JsonIgnoreProperties({"hibernateLazyInitializer", "handler"})
@Table(name = "media", schema = "db")
@SecondaryTable(name = "video_photo", schema = "db", pkJoinColumns = @PrimaryKeyJoinColumn(name = "media_id"))
public class MediaEntity {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "media_id")
    private Integer mediaId;

    @Enumerated(EnumType.STRING)
    @Column(name = "media_type", nullable = false, columnDefinition = "db.media_type")
    private MediaTypeEnum mediaType;

    @Lob
    @Column(name = "content", nullable = false)
    @org.hibernate.annotations.JdbcTypeCode(java.sql.Types.BINARY)
    private byte[] content;

    @Column(name = "blob_type", nullable = false)
    private String blobType;

    @Column(name = "analyzed", table = "video_photo", nullable = false)
    private boolean analyzed = false;

    @Column(name = "result", length = 500, nullable = false, table = "video_photo")
    private String result = "No result available";

    @Column(name = "reason", length = 800, nullable = false, table = "video_photo")
    private String reason = "No reasoning available";


    // Getters and setters
    public Integer getMediaId() { return mediaId; }
    public void setMediaId(Integer mediaId) { this.mediaId = mediaId; }
    public MediaTypeEnum getMediaType() { return mediaType; }
    public void setMediaType(MediaTypeEnum mediaType) { this.mediaType = mediaType; }
    public byte[] getContent() { return content; }
    public void setContent(byte[] content) { this.content = content; }
    public String getBlobType() { return blobType; }
    public void setBlobType(String blobType) { this.blobType = blobType; }
    public boolean isAnalyzed() { return analyzed; }
    public void setAnalyzed(boolean analyzed) { this.analyzed = analyzed; }
    public String getResult() { return result; }
    public void setResult(String result) { this.result = result; }
    public String getReason() { return reason; }
    public void setReason(String reason) { this.reason = reason; }
}